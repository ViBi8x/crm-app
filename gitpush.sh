#!/bin/bash
echo "Nhập nội dung commit:"
read msg
git add .
git commit -m "$msg"
git push
