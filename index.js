const express = require('express')
const AWS = require('aws-sdk')
const app = express()
const port = 3000

require('dotenv').config()

app.use(express.json());

const s3 = new AWS.S3(
  {
    accessKeyId: process.env.ACCESS_KEY, 
    secretAccessKey: process.env.SECRET_KEY,
    endpoint: process.env.ENDPOINT,
    region: process.env.REGION,
    s3ForcePathStyle: true,
    signatureVersion: 'v4'
  }
);

const myBucket = process.env.BUCKET

app.get('/', (req,res) => {
  res.sendFile(__dirname+'/index.html');
})

// Creates a multipart upload
app.get('/create_multipart_upload', (req, res) => {
  const fileName = req.query.fileName;

  const uploadId = s3.createMultipartUpload({
    Bucket: myBucket,
    Key: fileName,
  }, function(mpErr, multipart){
    if (mpErr) { console.log('Error!', mpErr); return; }
    res.send({"upload_id":multipart.UploadId});
  });
});

// Returns a pre-signed URL to upload a part to the uploadId given in query parameters
app.get('/part_upload_url', (req, res) => {
  const signedUrlExpireSeconds = 60 * 5 
  
  const partNumber = parseInt(req.query.partNumber, 10);
  const uploadId = req.query.uploadId;
  const fileName = req.query.fileName;

  const url = s3.getSignedUrl('uploadPart', {
    Bucket: myBucket,
    Key: fileName,
    UploadId: uploadId,
    PartNumber: partNumber,  
    Expires: signedUrlExpireSeconds,
  })

  res.send({ url: url })
});


// Completes a multipart upload
app.post('/complete_multipart_upload', (req, res) => {
  const params = req.body;  
  
  s3.completeMultipartUpload({
    Bucket: myBucket,
    Key: params.fileName,
    UploadId: params.uploadId,
    MultipartUpload: {Parts: params.parts},
  }, function(mpErr, multipart){
    if (mpErr) { console.log('Error!', mpErr); return; }
    res.send({"status":"OK"});
  });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))