'use strict';

// @ts-check

const Generator = require('yeoman-generator');
const prettier = require('gulp-prettier');
const findUp = require('find-up');
const { realpathSync } = require('fs');

module.exports = class extends Generator {
    constructor(args, opts) {
        super(args, opts);

        this.registerTransformStream(prettier({ tabWidth: 4 }));
    }

    /**
     * Get the root for the Magento install.
     * 
     * @return {string}
     */
    magentoRoot() {
        const bootstrapFile = findUp.sync('app/bootstrap.php', {
            cwd: this.options.contextRoot || this.contextRoot
        });

        return bootstrapFile
            ? realpathSync(`${bootstrapFile}/../..`)
            : null;
    }

    /**
     * @inheritdoc
     */
    destinationRoot() {
        return this.magentoRoot() || super.destinationRoot();
    }
}
