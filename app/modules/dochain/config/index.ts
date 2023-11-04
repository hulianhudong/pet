export const victor_conf = {
  ZILLIZ_ENDPOINT:
    'https://in01-1d51817d24f6f5a.aws-ap-southeast-1.vectordb.zillizcloud.com:19532',
  ZILLIZ_USER: 'db_admin',
  ZILLIZ_PASS: 'LLD-justdoit',
  EMBEDDING_VENDOR: 'wenxin',
  COLLECTION: 'petill',
};

Object.assign(process.env, victor_conf);
