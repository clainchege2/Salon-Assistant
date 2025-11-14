// Workaround for Node v25 localStorage issue
process.env.NODE_OPTIONS = '--no-experimental-global-webcrypto';

// Start react-scripts
require('react-scripts/scripts/start');
