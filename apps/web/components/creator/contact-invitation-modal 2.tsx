"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/modal";

interface ContactInvitationModalProps {
  creatorId: string;
  creatorName: string;
}

export function ContactInvitationModal({
  creatorId,
  creatorName,
}: ContactInvitationModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [purpose, setPurpose] = useState("");

  const canSubmit = useMemo(() => {
    return name.trim() && contact.trim() && purpose.trim();
  }, [contact, name, purpose]);

  function handleSubmit() {
    if (!canSubmit) return;
    setOpen(false);
    router.push(`/creators/${creatorId}/invitation?status=submitted&from=profile`);
  }

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalTrigger asChild>
        <Button>发起获取邀请</Button>
      </ModalTrigger>
      <ModalContent size="lg">
        <ModalHeader>
          <ModalTitle>申请联系创作者</ModalTitle>
          <ModalDescription>
            {creatorName} 当前以在职创作者身份进行创作，已开启身份信息保护。请先提交你的联系意向，平台会在获得创作者同意后开放下一步信息。
          </ModalDescription>
        </ModalHeader>

        <div className="grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">你的称呼</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="例如：某企业法务负责人"
              className="h-11 rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">联系方式</span>
            <input
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              placeholder="手机号、微信或邮箱"
              className="h-11 rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">联系目的</span>
            <textarea
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
              placeholder="说明你想了解的合作方向、项目背景或希望查看更多的信息"
              className="min-h-32 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
            平台会优先向创作者展示你的联系意向和项目背景。在创作者明确同意前，页面不会展示其真实姓名、详细单位或直接联系方式。
          </div>
        </div>

        <ModalFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            稍后再说
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            提交邀请
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
