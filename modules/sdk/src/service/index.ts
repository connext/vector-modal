import { InitParamsSchema } from '../constants';

export type ConnextNodeParamsSchema = {};

export class ConnextNode {
  public routerPublicIdentifier = '';
  public senderChannelAddress = '';
  public recipientChannelAddress = '';

  async init(params: InitParamsSchema) {
    this.routerPublicIdentifier = params.routerPublicIdentifier;

    
  }
}
