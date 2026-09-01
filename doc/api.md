## Modules

<dl>
<dt><a href="#module_binrpc">binrpc</a></dt>
<dd></dd>
<dt><a href="#module_client">client</a></dt>
<dd></dd>
<dt><a href="#module_server">server</a></dt>
<dd></dd>
</dl>

## Classes

<dl>
<dt><a href="#Client">Client</a></dt>
<dd></dd>
<dt><a href="#Protocol">Protocol</a></dt>
<dd></dd>
<dt><a href="#Server">Server</a></dt>
<dd></dd>
</dl>

<a name="module_binrpc"></a>

## binrpc

* [binrpc](#module_binrpc)
    * [.createClient(options)](#module_binrpc.createClient) ⇒ [<code>Client</code>](#Client)
    * [.createServer(options, onListening)](#module_binrpc.createServer) ⇒ [<code>Server</code>](#Server)

<a name="module_binrpc.createClient"></a>

### binrpc.createClient(options) ⇒ [<code>Client</code>](#Client)
RPC client factory

**Kind**: static method of [<code>binrpc</code>](#module_binrpc)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>object</code> |  |  |
| options.host | <code>string</code> |  | the hostname or ip address to connect to |
| options.port | <code>number</code> |  | the port to connect to |
| [options.reconnectTimeout] | <code>number</code> | <code>2500</code> | wait milliseconds until trying to reconnect after the socket was closed |
| [options.responseTimeout] | <code>number</code> | <code>5000</code> | wait milliseconds for method call response |
| [options.queueMaxLength] | <code>number</code> | <code>15</code> | maximum number of methodCalls that are allowed in the queue |

<a name="module_binrpc.createServer"></a>

### binrpc.createServer(options, onListening) ⇒ [<code>Server</code>](#Server)
RPC server factory

**Kind**: static method of [<code>binrpc</code>](#module_binrpc)  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> |  |
| options.host | <code>string</code> | ip address on which the server should listen |
| options.port | <code>number</code> | port on which the server should listen |
| onListening | <code>function</code> | function to be invoked in the server's `listening` callback |

<a name="module_client"></a>

## client

* [client](#module_client)
    * [.queue](#module_client+queue) : <code>Array</code>
    * [.queueMaxLength](#module_client+queueMaxLength) : <code>number</code>
    * [.queueRetryTimeout](#module_client+queueRetryTimeout) : <code>number</code>
    * [.pending](#module_client+pending) : <code>boolean</code>
    * [.responseTimeout](#module_client+responseTimeout) : <code>number</code>
    * [.connect()](#module_client+connect)
    * [.queuePush(buf, cb)](#module_client+queuePush)
    * [.queueShift()](#module_client+queueShift)
    * [.methodCall(method, params, callback)](#module_client+methodCall)

<a name="module_client+queue"></a>

### client.queue : <code>Array</code>
The request queue. Array elements must be objects with the properties buffer and callback

**Kind**: instance property of [<code>client</code>](#module_client)  
<a name="module_client+queueMaxLength"></a>

### client.queueMaxLength : <code>number</code>
Maximum queue length. If queue length is greater than this a methodCall will return error 'You are sending too fast'

**Kind**: instance property of [<code>client</code>](#module_client)  
<a name="module_client+queueRetryTimeout"></a>

### client.queueRetryTimeout : <code>number</code>
Time in milliseconds. How long to wait for retry if a request is pending

**Kind**: instance property of [<code>client</code>](#module_client)  
<a name="module_client+pending"></a>

### client.pending : <code>boolean</code>
Indicates if there is a request waiting for its response

**Kind**: instance property of [<code>client</code>](#module_client)  
<a name="module_client+responseTimeout"></a>

### client.responseTimeout : <code>number</code>
Time in milliseconds. How long to wait for a method call response

**Kind**: instance property of [<code>client</code>](#module_client)  
<a name="module_client+connect"></a>

### client.connect()
connect

**Kind**: instance method of [<code>client</code>](#module_client)  
<a name="module_client+queuePush"></a>

### client.queuePush(buf, cb)
Push request to the queue

**Kind**: instance method of [<code>client</code>](#module_client)  

| Param | Type |
| --- | --- |
| buf | <code>buffer</code> | 
| cb | <code>function</code> | 

<a name="module_client+queueShift"></a>

### client.queueShift()
Shift request from the queue and write it to the socket.

**Kind**: instance method of [<code>client</code>](#module_client)  
<a name="module_client+methodCall"></a>

### client.methodCall(method, params, callback)
methodCall

**Kind**: instance method of [<code>client</code>](#module_client)  

| Param | Type | Description |
| --- | --- | --- |
| method | <code>string</code> |  |
| params | <code>Array</code> |  |
| callback | <code>function</code> | optional - if omitted an empty string will be send as response |

<a name="module_server"></a>

## server
<a name="module_server+close"></a>

### server.close([callback]) ⇒ <code>Promise</code>
Close the server. Stops accepting new connections and destroys open
connections so the returned promise settles.

**Kind**: instance method of [<code>server</code>](#module_server)  

| Param | Type | Description |
| --- | --- | --- |
| [callback] | <code>function</code> | optional - invoked with (error) when closed |

<a name="Client"></a>

## Client
**Kind**: global class  
<a name="new_Client_new"></a>

### new Client(options)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>object</code> |  |  |
| options.host | <code>string</code> |  | the hostname or ip address to connect to |
| options.port | <code>number</code> |  | the port to connect to |
| [options.reconnectTimeout] | <code>number</code> | <code>2500</code> | wait milliseconds until trying to reconnect after the socket was closed |
| [options.responseTimeout] | <code>number</code> | <code>5000</code> | wait milliseconds for method call response |
| [options.queueMaxLength] | <code>number</code> | <code>15</code> | maximum number of methodCalls that are allowed in the queue |

<a name="Protocol"></a>

## Protocol
**Kind**: global class  

* [Protocol](#Protocol)
    * [.encodeRequest(method, data)](#Protocol.encodeRequest) ⇒ <code>Buffer</code>
    * [.encodeResponse(data)](#Protocol.encodeResponse) ⇒ <code>Buffer</code>
    * [.encodeData(obj)](#Protocol.encodeData) ⇒ <code>Buffer</code>
    * [.encodeStruct(obj)](#Protocol.encodeStruct) ⇒ <code>Buffer</code>
    * [.encodeStructKey(str)](#Protocol.encodeStructKey) ⇒ <code>Buffer</code>
    * [.encodeArray(arr)](#Protocol.encodeArray) ⇒ <code>Buffer</code>
    * [.encodeString(str)](#Protocol.encodeString) ⇒ <code>Buffer</code>
    * [.encodeBool(b)](#Protocol.encodeBool) ⇒ <code>Buffer</code>
    * [.encodeInteger(i)](#Protocol.encodeInteger) ⇒ <code>Buffer</code>
    * [.encodeDouble(d)](#Protocol.encodeDouble) ⇒ <code>Buffer</code>
    * [.decodeDouble(elem)](#Protocol.decodeDouble) ⇒ <code>object</code>
    * [.decodeString(elem)](#Protocol.decodeString) ⇒ <code>object</code>
    * [.decodeBool(elem)](#Protocol.decodeBool) ⇒ <code>object</code>
    * [.decodeInteger(elem)](#Protocol.decodeInteger) ⇒ <code>object</code>
    * [.decodeArray(elem)](#Protocol.decodeArray) ⇒ <code>object</code>
    * [.decodeStruct(elem)](#Protocol.decodeStruct) ⇒ <code>object</code>
    * [.decodeData(data)](#Protocol.decodeData) ⇒ <code>\*</code>
    * [.decodeResponse(data)](#Protocol.decodeResponse) ⇒ <code>\*</code>
    * [.decodeStrangeRequest(data)](#Protocol.decodeStrangeRequest) ⇒ <code>Array</code>
    * [.decodeRequest(data)](#Protocol.decodeRequest) ⇒ <code>\*</code>

<a name="Protocol.encodeRequest"></a>

### Protocol.encodeRequest(method, data) ⇒ <code>Buffer</code>
encode requests

**Kind**: static method of [<code>Protocol</code>](#Protocol)  

| Param | Type | Description |
| --- | --- | --- |
| method | <code>string</code> | throws error if not type string or if string is empty |
| data | <code>\*</code> | optional - defaults to an empty array |

<a name="Protocol.encodeResponse"></a>

### Protocol.encodeResponse(data) ⇒ <code>Buffer</code>
encode response

**Kind**: static method of [<code>Protocol</code>](#Protocol)  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>\*</code> | optional - defaults to empty string |

<a name="Protocol.encodeData"></a>

### Protocol.encodeData(obj) ⇒ <code>Buffer</code>
encode data

**Kind**: static method of [<code>Protocol</code>](#Protocol)  

| Param | Type | Description |
| --- | --- | --- |
| obj | <code>\*</code> | throws TypeError if obj is undefined or null |

<a name="Protocol.encodeStruct"></a>

### Protocol.encodeStruct(obj) ⇒ <code>Buffer</code>
encode struct

**Kind**: static method of [<code>Protocol</code>](#Protocol)  

| Param | Type | Description |
| --- | --- | --- |
| obj | <code>object</code> | throws error if not of type object |

<a name="Protocol.encodeStructKey"></a>

### Protocol.encodeStructKey(str) ⇒ <code>Buffer</code>
encode struct key

**Kind**: static method of [<code>Protocol</code>](#Protocol)  

| Param | Type | Description |
| --- | --- | --- |
| str | <code>string</code> | throws error if not of type string |

<a name="Protocol.encodeArray"></a>

### Protocol.encodeArray(arr) ⇒ <code>Buffer</code>
encode array

**Kind**: static method of [<code>Protocol</code>](#Protocol)  

| Param | Type | Description |
| --- | --- | --- |
| arr | <code>array</code> | throws error if not instance of Array |

<a name="Protocol.encodeString"></a>

### Protocol.encodeString(str) ⇒ <code>Buffer</code>
encode string

**Kind**: static method of [<code>Protocol</code>](#Protocol)  

| Param | Type | Description |
| --- | --- | --- |
| str | <code>string</code> | throws error if not of type string |

<a name="Protocol.encodeBool"></a>

### Protocol.encodeBool(b) ⇒ <code>Buffer</code>
encode bool

**Kind**: static method of [<code>Protocol</code>](#Protocol)  

| Param | Type | Description |
| --- | --- | --- |
| b | <code>\*</code> | any type |

<a name="Protocol.encodeInteger"></a>

### Protocol.encodeInteger(i) ⇒ <code>Buffer</code>
encode integer

**Kind**: static method of [<code>Protocol</code>](#Protocol)  

| Param | Type | Description |
| --- | --- | --- |
| i | <code>number</code> | throws error if not a number or if out of range (min=-2147483648 max=2147483647) |

<a name="Protocol.encodeDouble"></a>

### Protocol.encodeDouble(d) ⇒ <code>Buffer</code>
encode double

**Kind**: static method of [<code>Protocol</code>](#Protocol)  

| Param | Type | Description |
| --- | --- | --- |
| d | <code>number</code> | throws error if not a number |

<a name="Protocol.decodeDouble"></a>

### Protocol.decodeDouble(elem) ⇒ <code>object</code>
decode double

**Kind**: static method of [<code>Protocol</code>](#Protocol)  
**Returns**: <code>object</code> - properties content and rest  

| Param | Type | Description |
| --- | --- | --- |
| elem | <code>Buffer</code> | throws error if not an instance of Buffer or if length <8 |

<a name="Protocol.decodeString"></a>

### Protocol.decodeString(elem) ⇒ <code>object</code>
decode string

**Kind**: static method of [<code>Protocol</code>](#Protocol)  
**Returns**: <code>object</code> - properties content and rest  

| Param | Type | Description |
| --- | --- | --- |
| elem | <code>Buffer</code> | throws error if not an instance of Buffer or if length <4 |

<a name="Protocol.decodeBool"></a>

### Protocol.decodeBool(elem) ⇒ <code>object</code>
decode bool

**Kind**: static method of [<code>Protocol</code>](#Protocol)  
**Returns**: <code>object</code> - properties content and rest  

| Param | Type | Description |
| --- | --- | --- |
| elem | <code>Buffer</code> | throws error if not an instance of Buffer or if length <1 |

<a name="Protocol.decodeInteger"></a>

### Protocol.decodeInteger(elem) ⇒ <code>object</code>
decode integer

**Kind**: static method of [<code>Protocol</code>](#Protocol)  
**Returns**: <code>object</code> - properties content and rest  

| Param | Type | Description |
| --- | --- | --- |
| elem | <code>Buffer</code> | throws error if not an instance of Buffer or if length <4 |

<a name="Protocol.decodeArray"></a>

### Protocol.decodeArray(elem) ⇒ <code>object</code>
decode array

**Kind**: static method of [<code>Protocol</code>](#Protocol)  
**Returns**: <code>object</code> - properties content and rest  

| Param | Type | Description |
| --- | --- | --- |
| elem | <code>Buffer</code> | throws error if not an instance of Buffer or if length <4 |

<a name="Protocol.decodeStruct"></a>

### Protocol.decodeStruct(elem) ⇒ <code>object</code>
decode struct

**Kind**: static method of [<code>Protocol</code>](#Protocol)  
**Returns**: <code>object</code> - properties content and rest  

| Param | Type | Description |
| --- | --- | --- |
| elem | <code>Buffer</code> | throws error if not an instance of Buffer or if length <4 |

<a name="Protocol.decodeData"></a>

### Protocol.decodeData(data) ⇒ <code>\*</code>
decodes binary data

**Kind**: static method of [<code>Protocol</code>](#Protocol)  

| Param | Type |
| --- | --- |
| data | <code>Buffer</code> | 

<a name="Protocol.decodeResponse"></a>

### Protocol.decodeResponse(data) ⇒ <code>\*</code>
decode response

**Kind**: static method of [<code>Protocol</code>](#Protocol)  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Buffer</code> | throws TypeError if data is no instance of Buffer |

<a name="Protocol.decodeStrangeRequest"></a>

### Protocol.decodeStrangeRequest(data) ⇒ <code>Array</code>
decode "strange" request

**Kind**: static method of [<code>Protocol</code>](#Protocol)  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Buffer</code> | throws TypeError if data is no instance of Buffer |

<a name="Protocol.decodeRequest"></a>

### Protocol.decodeRequest(data) ⇒ <code>\*</code>
decode request

**Kind**: static method of [<code>Protocol</code>](#Protocol)  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Buffer</code> | throws TypeError if not instance of Buffer |

<a name="Server"></a>

## Server
**Kind**: global class  

* [Server](#Server)
    * [new Server(options, onListening)](#new_Server_new)
    * ["error" (error)](#Server+event_error)
    * ["listening"](#Server+event_listening)
    * ["[method]" (error, params, callback)](#Server+event_[method])
    * ["NotFound" (method, params)](#Server+event_NotFound)

<a name="new_Server_new"></a>

### new Server(options, onListening)

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> |  |
| options.host | <code>string</code> | ip address on which the server should listen |
| options.port | <code>number</code> | port on which the server should listen |
| onListening | <code>function</code> | function to be invoked in the server's `listening` callback |

<a name="Server+event_error"></a>

### "error" (error)
Re-emitted from the underlying net server (e.g. EADDRINUSE).
Without an error listener this throws, as usual for EventEmitters.

**Kind**: event emitted by [<code>Server</code>](#Server)  

| Param | Type |
| --- | --- |
| error | <code>Error</code> | 

<a name="Server+event_listening"></a>

### "listening"
Fires when the server is listening

**Kind**: event emitted by [<code>Server</code>](#Server)  
<a name="Server+event_[method]"></a>

### "[method]" (error, params, callback)
Fires when RPC method call is received

**Kind**: event emitted by [<code>Server</code>](#Server)  

| Param | Type | Description |
| --- | --- | --- |
| error | <code>\*</code> |  |
| params | <code>array</code> |  |
| callback | <code>function</code> | callback awaits params err and response |

<a name="Server+event_NotFound"></a>

### "NotFound" (method, params)
Fires if a RPC method call has no event handler.
RPC response is always an empty string.

**Kind**: event emitted by [<code>Server</code>](#Server)  

| Param | Type |
| --- | --- |
| method | <code>string</code> | 
| params | <code>array</code> | 

