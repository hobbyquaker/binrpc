import {EventEmitter} from 'node:events';
import {Socket, Server as NetServer} from 'node:net';

declare namespace binrpc {
    /**
     * Values the BIN-RPC wire format can carry. Wrap a whole number in
     * {explicitDouble: n} to force double encoding.
     */
    type RpcValue = number | string | boolean | RpcValue[] | {[key: string]: RpcValue};

    type MethodCallback = (error: Error | null | undefined, response?: RpcValue) => void;

    interface ClientOptions {
        /** hostname or ip address to connect to */
        host: string;
        /** port to connect to */
        port: number | string;
        /** wait milliseconds until trying to reconnect after the socket was closed (default 2500, 0 disables) */
        reconnectTimeout?: number;
        /** wait milliseconds for a method call response (default 5000) */
        responseTimeout?: number;
        /** maximum number of methodCalls that are allowed in the queue (default 100) */
        queueMaxLength?: number;
    }

    interface ServerOptions {
        /** ip address on which the server should listen */
        host: string;
        /** port on which the server should listen */
        port: number | string;
    }

    class Client {
        constructor(options: ClientOptions);
        host: string;
        port: number | string;
        connected?: boolean;
        socket: Socket;
        methodCall(method: string, params: RpcValue[], callback?: MethodCallback): void;
        connect(): void;
    }

    class Server extends EventEmitter {
        constructor(options: ServerOptions, onListening?: () => void);
        host: string;
        port: number | string;
        server: NetServer;
        /** stops accepting connections and destroys open ones */
        close(callback?: (error?: Error | null) => void): Promise<void>;
        on(event: 'listening', listener: () => void): this;
        on(event: 'error', listener: (error: Error) => void): this;
        on(event: 'NotFound', listener: (method: string | undefined, params: RpcValue[] | undefined) => void): this;
        /** every other event name is an RPC method call */
        on(event: string, listener: (error: null, params: RpcValue[], callback: MethodCallback) => void): this;
    }

    /** RPC client factory */
    function createClient(options: ClientOptions): Client;

    /** RPC server factory */
    function createServer(options: ServerOptions, onListening?: () => void): Server;
}

export = binrpc;
