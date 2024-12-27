'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface) => {
    const passwordHash = await bcrypt.hash('password123', 10);
    await queryInterface.bulkInsert(
      'Users',
      [
        {
          email: 'john@example.com',
          passwordHash: passwordHash,
        },
      ],
      {}
    );
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('Users', null, {});
  },
};
