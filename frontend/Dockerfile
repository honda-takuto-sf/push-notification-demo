# Node.js の公式イメージを使用（適宜バージョン変更）
FROM node:18

# 作業ディレクトリを /app に設定
WORKDIR /app

# パッケージマネージャーのキャッシュを活用するため、package.json を先にコピー
COPY package.json package-lock.json ./

# 🔥 ここで Firebase を含む依存関係をインストール
RUN npm install

# `firebase` をインストール
RUN npm install firebase

# Next.js のソースコードをコピー
COPY . .

# Next.js をビルド（開発環境の場合は不要）
# RUN npm run build

# サーバーを起動
CMD ["npm", "run", "dev"]
