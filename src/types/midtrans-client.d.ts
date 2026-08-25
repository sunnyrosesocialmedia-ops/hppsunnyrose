declare module "midtrans-client" {
  interface SnapConfig {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  }

  class Snap {
    constructor(config: SnapConfig);
    createTransaction(parameter: Record<string, unknown>): Promise<{
      token: string;
      redirect_url: string;
    }>;
  }

  class CoreApi {
    constructor(config: SnapConfig);
    transaction: {
      status(orderId: string): Promise<Record<string, unknown>>;
    };
  }

  const midtransClient: { Snap: typeof Snap; CoreApi: typeof CoreApi };
  export default midtransClient;
}
