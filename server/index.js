const config = require('./config');
const app = require('./app');

app.listen(config.port, config.host, () => {
  console.log(`Dispatch API listening on http://${config.host}:${config.port}`);
});
