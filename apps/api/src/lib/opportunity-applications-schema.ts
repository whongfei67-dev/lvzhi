/**
 * 扩展 opportunity_applications：支持「社区帖子」来源的投递，
 * 与对外岗位投递共用工作台「机会投递」列表。
 */
import { query } from './database.js'

/**
 * 无附件、仅正文时的 file_url 占位（前端不展示为下载链接）。
 * 用于：历史「社区投递」记录、合作机会列表「一键正文投递」。
 */
export const COMMUNITY_APPLICATION_FILE_URL = 'community:text-only'

let communityApplicationsSchemaEnsured = false

export async function ensureOpportunityApplicationsCommunitySupport(): Promise<void> {
  if (communityApplicationsSchemaEnsured) return
  try {
    await query(
      `ALTER TABLE opportunity_applications ADD COLUMN IF NOT EXISTS community_post_id UUID`,
    )
  } catch (err) {
    console.warn('[opportunity_applications] add community_post_id:', err)
  }
  try {
    await query(`ALTER TABLE opportunity_applications ALTER COLUMN opportunity_id DROP NOT NULL`)
  } catch {
    /* 已为可空 */
  }
  try {
    await query(
      `ALTER TABLE opportunity_applications DROP CONSTRAINT IF EXISTS opportunity_applications_opportunity_id_applicant_id_key`,
    )
  } catch (err) {
    console.warn('[opportunity_applications] drop legacy unique:', err)
  }
  try {
    await query(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_oa_opp_applicant
       ON opportunity_applications (opportunity_id, applicant_id)
       WHERE opportunity_id IS NOT NULL`,
    )
  } catch (err) {
    console.warn('[opportunity_applications] unique idx opp:', err)
  }
  try {
    await query(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_oa_cp_applicant
       ON opportunity_applications (community_post_id, applicant_id)
       WHERE community_post_id IS NOT NULL`,
    )
  } catch (err) {
    console.warn('[opportunity_applications] unique idx community:', err)
  }
  try {
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'opportunity_applications_community_post_id_fkey'
        ) THEN
          ALTER TABLE opportunity_applications
            ADD CONSTRAINT opportunity_applications_community_post_id_fkey
            FOREIGN KEY (community_post_id) REFERENCES community_posts(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `)
  } catch (err) {
    console.warn('[opportunity_applications] fk community_post_id:', err)
  }
  try {
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'oa_target_xor_ck') THEN
          ALTER TABLE opportunity_applications ADD CONSTRAINT oa_target_xor_ck CHECK (
            (opportunity_id IS NOT NULL AND community_post_id IS NULL) OR
            (opportunity_id IS NULL AND community_post_id IS NOT NULL)
          );
        END IF;
      END $$;
    `)
  } catch (err) {
    console.warn('[opportunity_applications] check oa_target_xor_ck:', err)
  }
  communityApplicationsSchemaEnsured = true
}
