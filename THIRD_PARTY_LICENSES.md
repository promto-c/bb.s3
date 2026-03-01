# Third-Party Licenses

This document lists the third-party dependencies used by **BB.S3** and their respective licenses.

BB.S3 itself is licensed under the [MIT License](./LICENSE).

---

## Direct Production Dependencies

| Package | License | Repository |
|---------|---------|------------|
| [@aws-sdk/client-s3](https://github.com/aws/aws-sdk-js-v3) | Apache-2.0 | https://github.com/aws/aws-sdk-js-v3 |
| [@aws-sdk/s3-request-presigner](https://github.com/aws/aws-sdk-js-v3) | Apache-2.0 | https://github.com/aws/aws-sdk-js-v3 |
| [@playcanvas/supersplat-viewer](https://github.com/playcanvas/supersplat-viewer) | MIT | https://github.com/playcanvas/supersplat-viewer |
| [lucide-react](https://lucide.dev) | ISC | https://github.com/lucide-icons/lucide |
| [papaparse](https://www.papaparse.com) | MIT | https://github.com/mholt/PapaParse |
| [react](https://react.dev) | MIT | https://github.com/facebook/react |
| [react-dom](https://react.dev) | MIT | https://github.com/facebook/react |

## Direct Development Dependencies

| Package | License | Repository |
|---------|---------|------------|
| [@types/node](https://github.com/DefinitelyTyped/DefinitelyTyped) | MIT | https://github.com/DefinitelyTyped/DefinitelyTyped |
| [@types/papaparse](https://github.com/DefinitelyTyped/DefinitelyTyped) | MIT | https://github.com/DefinitelyTyped/DefinitelyTyped |
| [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) | MIT | https://github.com/vitejs/vite-plugin-react |
| [autoprefixer](https://github.com/postcss/autoprefixer) | MIT | https://github.com/postcss/autoprefixer |
| [postcss](https://postcss.org) | MIT | https://github.com/postcss/postcss |
| [tailwindcss](https://tailwindcss.com) | MIT | https://github.com/tailwindlabs/tailwindcss |
| [typescript](https://www.typescriptlang.org) | Apache-2.0 | https://github.com/microsoft/TypeScript |
| [vite](https://vitejs.dev) | MIT | https://github.com/vitejs/vite |
| [vitest](https://vitest.dev) | MIT | https://github.com/vitest-dev/vitest |

## Transitive Dependencies

The AWS SDK (`@aws-sdk/*`) pulls in numerous transitive packages, all licensed under **Apache-2.0**. The `@playcanvas/supersplat-viewer` bundles the [PlayCanvas Engine](https://github.com/playcanvas/engine) (MIT). For a full list of transitive dependencies and their licenses, run:

```bash
npx license-checker --production
```

## License Summaries

### MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files, to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.

Full text: https://opensource.org/licenses/MIT

### Apache License 2.0

A permissive license that also provides an express grant of patent rights from contributors to users.

Full text: https://www.apache.org/licenses/LICENSE-2.0

### ISC License

A simplified version of the MIT/BSD licenses that is functionally equivalent to the MIT License.

Full text: https://opensource.org/licenses/ISC
