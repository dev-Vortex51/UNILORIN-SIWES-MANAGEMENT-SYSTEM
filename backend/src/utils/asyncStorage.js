const { AsyncLocalStorage } = require("async_hooks");

const auditStorage = new AsyncLocalStorage();

const getAuditContext = () => auditStorage.getStore() || {};

const runWithAuditContext = (context, fn) => auditStorage.run(context, fn);

module.exports = { auditStorage, getAuditContext, runWithAuditContext };
