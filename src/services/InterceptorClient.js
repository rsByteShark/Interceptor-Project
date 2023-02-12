// Assumes an echo server that is listening on port 8000.
const tls = require('node:tls');

const optionss = {

    host: "127.0.0.1",

    port: "8000",

    rejectUnauthorized: false,
};

const preloadedKey = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCvC5IPKhffuEgY
XVvoLgWb8IxrtYCrc+Zp3JNn8+f5v5T2iocDQmD1oJ7WWPiqx/FiVvujnd2nfztS
JPTqzqa0pAu1Gypg/XjmsBBZNbqddZhOuNIiv72redEFvkztfKMKfLBBPkPwDjg6
gtllLFCXUHT9rG82An27+KBwK+pC6pwQ5Nw7uCP5HuxSoKRtAHpshg3phUHQBToT
PkPwvxce5IiZNNl06CChakwVKgDS3X80MpPfbcECO8Srqi5qxcf75zRCKfGzaZyd
nqdyNlR7LCUq7R/zzeGrsZbq/B1BUUnkjm7ueIXzV/v7sY/uOQP5DxiUbLogK5y2
xnhO4WkPAgMBAAECggEAKtQW6ZTwAHITWbrF+PoBr1Tc1qGzGMAj2TT58A5SbN3+
MZBVVmvQU2j4VBOyy/5dxiToLvE6QXg06HVYY3cqfLpCjw5VgSOjiDX92gX2Yf5a
xLAd4hit7J3CkbgtFFJRhghaC6yTbNHd2hsX29RK56rs5QBiuYFEiFBd2PQ1vidG
5jNmDxNcuvTnK1ua4hug4jNOuc7EA11hwmEH1ksn3Lzn8EKNIl+xjrO3OrVuIrOH
Ow1YF6dEfDQ+BM1lpNb3jkWfWzRkKbOm93l8Fwr70Zt0ZUkZHEAScoEZe7GQ/ggE
dWRMmVcn1H/Had1YrFDKC71jxgWJhVlaWm8h4leJ4QKBgQC/OTwd+laVYyHM1Jbv
WwtU2rJPI68rSUJNcaUmr5XeOtlo1aWvN8AZF3WLfJK2G+NY5IZP7gVrMQacz8CY
i3jl7FQL9FlpIcYn+HUaV4ybZQfW/wRHf7/79YhbMwEjJMNBhklIaH8oF70j5Eqp
0HZPGRF/Wf0yIwZfXNHqNj27sQKBgQDqV1vqQ3c9mx6RXfe6Dksea4YbtCOeBRpM
mePsVRXm6W1pBmWucmcTnj5J33s6TPFGLyipuGwmDuKUrSDNL/545SMGUSvZDCAh
2SdCWOTHr2LfWJqYKAqpRkj42CIcxzSSkkWxhWMmBHtQgXY3fuJ8u7obIShyLq/m
ri3lg3BgvwKBgQCkjJDhzwjwtgRg6VMUl0jR9PtZRIC5A+ptD+0otBGH0SZCow5X
D+da8CfzJvhsguUJGmVFpLG/AsoI6HF4ExSu7cWJH/RMloaY4KGMUGgrVC4B4SKC
kDjZjPiQWfyRjFIFMZQgHePF0V+t4gYpyLv15sF60CokGaWjLBFqtNA8kQKBgQCG
TNCRfl69AMRQ/TB3AbANXAP8po1vB2+eDOfxzoWB069vbEoj4s6uEJeUEK73p5by
6R39voLEgO1b1aihz2qgcHlVKnndpzRXEbONM5LR2fLpG0dmAjSx9GTnsD5EjenU
Ql4MsewzoofliHxuq5ozcAble2hJn/YRVytYiK6D0wKBgFKsLqml8/enTL3DilX+
ktJ4Fc0ylAaZES8cIa53JRAvk4pZ6OxWBcMV32e2nWAdiDOf0ppKMZv/nVT0jQtC
H/EZ/jyXioxLezg3ATWWCG5oB1YKzk8KRq887Je3HNuOgKbMQPDO8o5MYu5TyA6J
zj6fCAZCI6aQ2H/DOEpsrBV6
-----END PRIVATE KEY-----`;

const preloadedCert = `-----BEGIN CERTIFICATE-----
MIIDBTCCAe0CFBLeHFRhhndMLuFoEtT628QeM5kfMA0GCSqGSIb3DQEBCwUAMD8x
CzAJBgNVBAYTAlBMMRowGAYDVQQKDBFJbnRlcmNlcHRvclNlcnZlcjEUMBIGA1UE
AwwLSW50ZXJjZXB0b3IwHhcNMjMwMTA3MTUyNDEwWhcNMjQwMTA3MTUyNDEwWjA/
MQswCQYDVQQGEwJQTDEaMBgGA1UECgwRSW50ZXJjZXB0b3JTZXJ2ZXIxFDASBgNV
BAMMC0ludGVyY2VwdG9yMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
rwuSDyoX37hIGF1b6C4Fm/CMa7WAq3PmadyTZ/Pn+b+U9oqHA0Jg9aCe1lj4qsfx
Ylb7o53dp387UiT06s6mtKQLtRsqYP145rAQWTW6nXWYTrjSIr+9q3nRBb5M7Xyj
CnywQT5D8A44OoLZZSxQl1B0/axvNgJ9u/igcCvqQuqcEOTcO7gj+R7sUqCkbQB6
bIYN6YVB0AU6Ez5D8L8XHuSImTTZdOggoWpMFSoA0t1/NDKT323BAjvEq6ouasXH
++c0Qinxs2mcnZ6ncjZUeywlKu0f883hq7GW6vwdQVFJ5I5u7niF81f7+7GP7jkD
+Q8YlGy6ICuctsZ4TuFpDwIDAQABMA0GCSqGSIb3DQEBCwUAA4IBAQApwWS6uB+g
4EEGXswBUEpWi8SEBf3sjJPRPULbQHhOnsxextsphp0y9GJvGkB+SxWyceJYwM01
rbAb3wZtIza1K4ntrWv60jp8Fh01LvMAiRJ2GToxJuKwI6/nls0AcAxJRzwSsFyN
GLXvG1hEVYyXXsoh5fJ6jh4zvN8cfNMzCTEmVeFLHqnl2jGud8bF9uII11zuQx4P
ncHzorN8LNeKxxYo4kLI5GyEeiRbOhRkBqkr6PMZxce6/Xq71N0zag+yCgtMMxUP
X9RipHYZ4cj26idSrSwjXh4Swyk9kSJ/2p7wTHRy0TdOwBrYnJgD+2nq2jEOFSpE
c4MXKdNGSJB+
-----END CERTIFICATE-----`;

class Client {

    constructor(httpObject, refToParentInterceptedSocket) {

        this.tlsConnector = new tls.TLSSocket(null, { key: preloadedKey, cert: preloadedCert });


        this.tlsConnector.on("data", (data) => {

            console.log(data);


        })

        this.refToParentInterceptedSocket = refToParentInterceptedSocket;

        if (httpObject.isHttp) {

            if (httpObject.type === "request") {

                if (httpObject.method === "CONNECT") {

                    this.handleHttpsRequest(httpObject);

                } else {


                    this.handleHttpRequest(httpObject);

                }

            } else {

                throw `recived unexpected http ${httpObject.type} in outbound traffic on socket ${this.refToParentInterceptedSocket.socketUid}`

            }


        } else {

            this.tlsConnector.write()

            throw `recived unexpected protocol in outbound traffic on socket ${this.refToParentInterceptedSocket.socketUid}`

        }


    }


    static makeTlsRequest(target) {

        const retObj = {

            key: null,

            cert: null,

        }

        const tlsOptions = {

            host: target,

            port: 443,

            checkServerIdentity: (serverName, cert) => {

                retObj.cert = Client.pemEncode(Buffer.from(cert.raw), "CERTIFICATE");

                retObj.key = Client.pemEncode(Buffer.from(cert.raw), "PRIVATE KEY");

                const x = retObj.cert.toString()
                const z = retObj.key.toString()

                console.log('\n\n---------------------------------------------------------------------------------------------------\n\n');

                const srv = tls.createServer({ cert: retObj.cert, key: retObj.key }, (socket) => {

                    socket.on("data", (data) => {

                        console.log(data.toString());

                        socket.write("data");

                    })

                })



                srv.listen(8000, () => {

                    console.log('srv works');


                })



                return null;
            },
        }

        const socket = tls.connect(tlsOptions, () => {

            console.log('client connected', socket.authorized ? 'authorized' : 'unauthorized');


            socket.destroy();

        });

        socket.setEncoding('utf8');



        socket.on('data', (data) => {
            console.log(data);
        });


        socket.on('end', () => {
            console.log('server ends connection');
        });


        return retObj

    }

    static pemEncode(dataBuffer, label) {

        return Buffer.from(`-----BEGIN ${label}-----\n${dataBuffer.toString("base64")}\n-----END ${label}-----`)

    };

    handleHttpRequest(httpRequestObject) {

        console.log(`http request to ${httpRequestObject.path}`);


    }

    connectionOpen = false;

    handleHttpsRequest(httpRequestObject) {

        if (!this.connectionOpen) {

            this.refToParentInterceptedSocket.socketReference.write("HTTP/1.1 200 OK\n\n")

            this.connectionOpen = true;

        } else {

            this.tlsConnector.write()

        }

        console.log(`https request to ${httpRequestObject.path}`);

    }

}





module.exports = Client







