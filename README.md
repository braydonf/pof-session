Proof-of-Work HTTP Session
==========================

A bitcoin inspired experiment with using proof-of-work hashing for HTTP API session authorization.

## Motivation

IP based rate limiting is grounded on IP addresses being scarce, however with IPv6 and other public key based routing systems there is no such scarcity. And even with IPv4, addresses are rotated (Tor exit nodes, VPN, ISP) and gaining incorrect reputations and required to enter a CAPTCHA that creates issues with applications getting authorization. With a proof-of-work based challenge instead of CAPTCHA, the task is possible for an API client to complete in the background and can more effectively increase the cost of a DOS attack.

## License

Code released under the [MIT license](LICENSE).

Copyright 2016, Braydon Fuller