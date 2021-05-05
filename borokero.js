// const mongoPersistence = require("aedes-persistence-mongodb");
const HTTP = require('./lib/http')
const authBroker = require('@authbroker/authbroker')
const aedes = require('aedes')()

const authbroker = new authBroker()
/*
const aedes = require("aedes")({
  persistence: mongoPersistence({
    url: "mongodb://172.17.0.2/aedes-test",
    // Optional ttl settings
    ttl: {
      // TTL indexes are special single-field indexes that MongoDB can use to automatically remove documents from a collection after a certain amount of time or at a specific clock time.
      packets: 300, // Number of seconds
      subscriptions: 300,
    },
  }),
});
*/

aedes.on('retained', function (topic, payload) {
  console.log(
    'Topic: \x1b[33m" + topic + "\x1b[0m',
    'updated to: ',
    payload.toString()
  )
})

const http = new HTTP({
  brokero: aedes,
  port: 3000,
  authenticate: authbroker.authenticateWithAccessToken(),
  authorizeGet: authbroker.authorizeSubscribe(),
  authorizePut: authbroker.authorizePublish()
},
function (err, res) {
  console.log(err)
})
