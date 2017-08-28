crx pack -o polyocat.crx
rm key.pem

sed -i '' -e "4s/\(\"version\": \"\).\..\../\1$1/" manifest.json
sed -i '' -e "3s/\(\"version\": \"\).\..\../\1$1/" package.json
sed -i '' -e "3s/\(\"version\": \"\).\..\../\1$1/" package-lock.json

git add .
git commit -m "v$1"
git tag v$1