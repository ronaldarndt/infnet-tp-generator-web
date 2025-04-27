import { Hono } from "hono";
import { Style } from "hono/css";
import { jsxRenderer } from "hono/jsx-renderer";
import { App } from "./client/app";
import { getAssetImportTagsFromManifest } from "./utils";

const web = new Hono();

web.use(
  "*",
  jsxRenderer(
    ({ children }) => {
      const assetImportTags = getAssetImportTagsFromManifest();

      return (
        <html lang="en">
          <head>
            <meta charSet="utf-8" />
            <meta
              content="width=device-width, initial-scale=1"
              name="viewport"
            />
            <title>Infnet</title>
            <link rel="icon" href="/favicon.svg" />
            <Style />
            {assetImportTags}
          </head>

          <body>{children}</body>
        </html>
      );
    },
    { docType: true }
  )
);

web.get("/", c => {
  return c.render(
    <div id="ssr-root" data-root>
      <App />
    </div>
  );
});

export default web;
