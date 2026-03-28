import Fastify from 'fastify';
const app = Fastify();
app.addContentTypeParser('*', { parseAs: 'buffer' }, (req, body, done) => {
  done(null, body);
});
app.post('/', (req, reply) => {
  reply.send({ type: typeof req.body, isBuffer: Buffer.isBuffer(req.body), body: req.body });
});
app.listen({ port: 3001 }, () => console.log('Listening'));
