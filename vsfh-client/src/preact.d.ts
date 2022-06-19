// See https://github.com/preactjs/preact-router/issues/353

import "preact";

declare module "preact" {
  interface PreactDOMAttributes {
    native?: boolean;
  }
}
