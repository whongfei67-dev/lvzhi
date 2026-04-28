import type { NextPageContext } from "next";
import NextError from "next/error";

type ErrorProps = { statusCode: number };

export default function ErrorPage({ statusCode }: ErrorProps) {
  return <NextError statusCode={statusCode} />;
}

ErrorPage.getInitialProps = async ({ res, err }: NextPageContext) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 404;
  return { statusCode };
};
