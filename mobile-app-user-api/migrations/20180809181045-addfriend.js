/**
 * Migration to create AddFriend table.
 */

var config = require(__dirname + '/../config/config.json');

module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('addfriend', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    useridby: {
      type: Sequelize.INTEGER,
    },
    useridto: {
      type: Sequelize.INTEGER,
    },
    isblocked: {
      defaultValue: false,
      type: Sequelize.BOOLEAN,
    },
    isarchived: {
      defaultValue: false,
      type: Sequelize.BOOLEAN,
    },
    status: {
        type: Sequelize.STRING,
    },
    blockedate: {
      type: Sequelize.DATE,
    },
    requestsentat: {
      type: Sequelize.DATE,
    },
    type: { 
      type: Sequelize.STRING,
    },
    requestacceptedate: {
      type: Sequelize.DATE,
    },
    requestrejectedate: {
      type: Sequelize.DATE,
    },
    updatedat: {
      type: Sequelize.DATE,
    },
    deletedat: {
      defaultValue: null,
      type: Sequelize.DATE,
    },
  }),
  down: (queryInterface, Sequelize) => queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.dropTable('addfriend', { transaction });
  }),
};
