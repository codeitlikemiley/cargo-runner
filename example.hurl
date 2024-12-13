# Run this with hurl --test example.hurl

# httpbin
GET http://httpbin.org/get
HTTP 200

# example.com
GET http://example.com
HTTP 200
[Asserts]
xpath "string(//head/title)" == "Example Domain"
xpath "//p" count == 2
xpath "string((//p)[1])" contains "This domain is for use in illustrative examples in documents."
header "Content-Type" == "text/html; charset=UTF-8"
