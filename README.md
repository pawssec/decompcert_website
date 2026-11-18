# DeCompCert website

This directory is a dependency-free static website for DeCompCert.  It presents
the project, formal assurance model, evaluation results, and a client-side
pipeline explorer.  It does not contain or expose the private decompiler.

The public explorer presents an accepted `add_call.c` reconstruction generated
by the real DeCompCert pipeline.  Its excerpts omit repetitive runtime-library
declarations but otherwise follow the generated intermediate representations.
The dormant client-side bundle reader can be enabled later for a developer or
authenticated deployment; no backend or compiler implementation is included
in this website.

## Preview locally

From the main DeCompCert repository root:

```sh
python3 -m http.server 8088 --directory website
```

Open <http://127.0.0.1:8088>.

## Publish with GitHub Pages

The repository contains a manual GitHub Pages workflow.  Keeping it manual is
intentional: the implementation is private and the website should not be
published until the project owners choose to do so.

1. In the GitHub repository settings, select **Pages → GitHub Actions** as the
   source.
2. Open **Actions → Deploy DeCompCert website**.
3. Select **Run workflow**.

Only the contents of this directory are uploaded as the Pages artifact.  The
repository source and decompiler are not included in the deployed website.

For the dedicated `pawssec/decompcert_website` repository, copy the contents of
this directory to the repository root and change the artifact path in the
workflow from `website` to `.`.  The resulting project Pages URL is
`https://pawssec.github.io/decompcert_website/`.
