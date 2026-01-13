export default <WebRexConfiguration>{
  hostname: 'localhost',
  port: 3001,
  tunnelingToken: 'my-token',
  tunnelingEnabled: false,
  forceMock: true,
  mockFromHAR: {
    name: 'Debug a deffect by replaying session of another user',
    // regular expression that matches all except those which include "token"
    // useful to avoid auth problems because token have expire time
    context: '^((?!token).)*$',
    // the path for the har file
    target: 'file:///config/har/my-site.com.har',
    disabled: true,
  },
  proxy: [
    {
      name: 'Frontend',
      context: '/',
      target: 'http://localhost:4200', // angular app
    },
  ],
};
