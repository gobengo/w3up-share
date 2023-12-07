# sharing space acccess with w3up


Create a delegation at `private/d1.car`
```
node ./create-delegation.mjs \
  --space='did:key:z6MkndD3taVNjVJqfcBEdgc74Q22k3ZqU1BLZMauduknsgY6' \ --audience=did:mailto:gmail.com:bengoering \
  --output private/d1.car
```

Now send it using an invocation to `access/delegate` at web3.storage
```
node ./delegate-delegation-with-w3.js \
  --car=private/d1.car
```
