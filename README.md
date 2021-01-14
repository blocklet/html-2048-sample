# static-demo-blocklet

![](https://github.com/arcblock/forge-webapp/workflows/build/badge.svg)
![](https://img.shields.io/badge/Powered%20By-ABT%20Node-yellowgreen)

Demo blocklet contains only static files, which is an html5 game

## Install on my ABT Node

[![Install on my ABT Node](https://raw.githubusercontent.com/blocklet/development-guide/main/assets/install_on_abtnode.svg)](https://install.arcblock.io/?action=blocklet-install&meta_url=https%3A%2F%2Fgithub.com%2Fblocklet%2Fhtml-2048-sample%2Freleases%2Fdownload%2F1.1.7%2Fblocklet.json)

## Run and debug in the cloud with Gitpod

Click the "Open in Gitpod" button, Gitpod will start ABT Node and the blocklet.

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/blocklet/static-demo)

## Run and debug locally

```shell
yarn global add @abtnode/cli
git clone git@github.com:blocklet/static-demo.git
cd static-demo
abtnode init --mode debug
abtnode start
blocklet dev
```

## License

The code is licensed under the MIT license found in the
[LICENSE](LICENSE) file.
