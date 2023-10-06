const zlib = require('zlib');

function zipResponseMiddleware(req, res, next) {
  // Capture the response data using a writable stream
  const originalWrite = res.write;
  const originalEnd = res.end;

  const chunks = [];

  res.write = function (chunk) {
    chunks.push(chunk);
    originalWrite.apply(res, arguments);
  };

  res.end = function (chunk) {
    if (chunk) {
      chunks.push(chunk);
    }

    const responseData = Buffer.concat(chunks);
    
    // Compress the response data using zlib
    zlib.gzip(responseData, (err, compressedData) => {
      if (err) {
        console.error('Error compressing data:', err);
        res.status(500).send('Internal Server Error');
        return;
      }

      // Set response headers for a ZIP response
      res.setHeader('Content-Disposition', 'attachment; filename=output.zip');
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Encoding', 'gzip'); // Indicate that the content is gzipped

      // Send the compressed data as the response
      res.send(compressedData);
    });

    // Restore the original write and end methods
    res.write = originalWrite;
    res.end = originalEnd;
  };

  next();
}

module.exports = zipResponseMiddleware;
