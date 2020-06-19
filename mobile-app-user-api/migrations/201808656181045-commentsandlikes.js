/**
 * Migration to create comments and likes on posts table.
 */

var config = require(__dirname + '/../config/config.json')

module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('usersactivityonpost', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    userid: {
      type: Sequelize.INTEGER,
    },
    postid: {
      type: Sequelize.INTEGER,
    },
    commentid: {
      type: Sequelize.INTEGER,
    },
    type: {   //like/comment/view
      type: Sequelize.STRING,
    },
    commentvalue: {
      type: Sequelize.STRING,
    },
    commentlikeby: {
      type: Sequelize.INTEGER,
    },
    iscommentlike: {
      type: Sequelize.BOOLEAN,
    },
    commentlikecount: {
      type: Sequelize.INTEGER,
    },
    likevalue: {
      type: Sequelize.STRING,
    },
    createdat: {
      defaultValue: Sequelize.fn('NOW'),
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
    await queryInterface.dropTable('usersactivityonpost', { transaction });
  }),
};
