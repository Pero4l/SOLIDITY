const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("AllTodoModule", (m) => {
  const allTodo = m.contract("AllTodo");

  return { allTodo };
});
