declare const _default: (() => {
    nodeEnv: string;
    port: number;
    apiPrefix: string;
    corsOrigin: string;
    jwt: {
        secret: string;
        expiresIn: string;
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    nodeEnv: string;
    port: number;
    apiPrefix: string;
    corsOrigin: string;
    jwt: {
        secret: string;
        expiresIn: string;
    };
}>;
export default _default;
