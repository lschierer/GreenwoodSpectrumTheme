# GreenwoodSpectrumTheme
A theme pack for Greenwood using [Adobe Spectrum] CSS and Web Components.

Some notes on running this:
* [mise], if installed will attempt to set up your environment for you to the extent it can.
  * This project assumes node version 22 or later.  There is a chance it *might* work with an earlier version of 22, or possibly even version 21 or 20.
  * I am using [pnpm] for package management.

[mise]: https://mise.jdx.dev
[pnpm]: https://pnpm.io/
[Adobe Spectrum]: https://spectrum.adobe.com/

Eventually this is intended to be a [Theme Pack].  Once that part of the development is complete, and if you install it with that intent, you will need to customize the config file at src/greenwood-spectrum-theme.config.ts or specify an alternate config in src/lib/config.ts

[Theme Pack]: https://greenwoodjs.dev/guides/tutorials/theme-packs/
