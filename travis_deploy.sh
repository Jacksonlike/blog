BUNDLE_DIR="/server/ci-versions/blog"
BUNDLE="blog.tar.gz"
NGINX_DIR="/server/blog"

cd ${BUNDLE_DIR}
tar -zxf ${BUNDLE} 
rm -f ${BUNDLE}
find . -maxdepth 1 -type d -mtime +365 -exec -rm -rf {} \;
rm -f ${NGINX_DIR}
ln -s ${BUNDLE_DIR}/re_VERSION ${NGINX_DIR}
