declare module "opencc-js" {
  export type OpenCcLocale = "cn" | "tw" | "hk" | "jp";

  export interface ConverterOptions {
    from: OpenCcLocale;
    to: OpenCcLocale;
  }

  export function Converter(options: ConverterOptions): (text: string) => string;
}
