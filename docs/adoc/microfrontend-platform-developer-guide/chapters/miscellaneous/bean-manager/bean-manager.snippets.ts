// tag::lookup-bean[]
import { MessageClient } from '@scion/microfrontend-platform';
import { Beans } from '@scion/toolkit/bean-manager';

const messageClient = Beans.get(MessageClient);
// end::lookup-bean[]
