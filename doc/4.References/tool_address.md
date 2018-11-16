# 生成一个密钥对
`address_tool create`

生成一个新密钥对，并返回对应的地址和十六进制格式的私钥

示例

```
address_tool create
address:1DkGniDMhvTDMHqwrygjVqeeNDMkyvLtaC secret:82e52741184b8767eab2a76efccc96d3fe1f9b6c270d7a8133c130ba3e671958
```

# 私钥转换公钥/地址
` address_tool convert --secret <secretKeyHex>`

输入十六进制格式的私钥，返回对应的公钥和地址

示例

```
address_tool convert --secret 82e52741184b8767eab2a76efccc96d3fe1f9b6c270d7a8133c130ba3e671958

address:1DkGniDMhvTDMHqwrygjVqeeNDMkyvLtaC
pubkey:02511d68c95e3571e339eba118e43d1e0c93491842d1896c075e806366e4cb8697
```

# 公钥转换地址
` address_tool convert --pubkey <publicKeyHex>`

输入十六进制格式的公钥，返回对应的地址

示例

```
address_tool convert --pubkey 02511d68c95e3571e339eba118e43d1e0c93491842d1896c075e806366e4cb8697
address:1DkGniDMhvTDMHqwrygjVqeeNDMkyvLtaC
```