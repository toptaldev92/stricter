/**
 * Integration tests
 */

import getStricter from '../factory';

describe('Stricter', () => {
    const stricterConfigPath = `${__dirname}/__fixtures__/stricter.config.js`;

    beforeEach(() => {
        // Comment out the mockImplementation to debug issues
        jest.spyOn(console, 'log').mockImplementation(() => null);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.resetModules();
    });

    it('should report no errors when no rules or rulesDir specified', () => {
        jest.doMock(stricterConfigPath, () => ({
            root: 'project/src',
            rules: {},
        }));
        const stricter = getStricter({
            config: stricterConfigPath,
            reporter: undefined,
            rulesToVerify: undefined,
            clearCache: undefined,
        });

        stricter();
        expect(console.log).toHaveBeenCalledTimes(1);
        expect(console.log).toHaveBeenCalledWith('No errors');
    });

    it('should report no errors when default rules and rulesDir are specified', () => {
        jest.doMock(stricterConfigPath, () => ({
            root: 'project/src',
            rulesDir: 'project/rules',
            exclude: [/.*\.json/],
            rules: {
                'stricter/unused-files': [
                    {
                        level: 'error',
                        config: {
                            entry: [/.*\/src\/index\.js/],
                        },
                    },
                ],
            },
        }));
        const stricter = getStricter({
            config: stricterConfigPath,
            reporter: undefined,
            rulesToVerify: undefined,
            clearCache: undefined,
        });

        stricter();
        expect(console.log).toHaveBeenCalledTimes(1);
        expect(console.log).toHaveBeenCalledWith('No errors');
    });

    it('should report no errors when default rules and multiple rulesDir are specified', () => {
        jest.doMock(stricterConfigPath, () => ({
            root: 'project/src',
            rulesDir: ['project/rules', 'project/another_rules'],
            exclude: [/.*\.json/],
            rules: {
                'stricter/unused-files': [
                    {
                        level: 'error',
                        config: {
                            entry: [/.*\/src\/index\.js/],
                        },
                    },
                ],
            },
        }));
        const stricter = getStricter({
            config: stricterConfigPath,
            reporter: undefined,
            rulesToVerify: undefined,
            clearCache: undefined,
        });

        stricter();
        expect(console.log).toHaveBeenCalledTimes(1);
        expect(console.log).toHaveBeenCalledWith('No errors');
    });

    it('should report errors when a rule violation occurs', () => {
        jest.doMock(stricterConfigPath, () => ({
            root: 'project/src',
            rulesDir: 'project/rules',
            exclude: [/.*\.json/],
            rules: {
                'stricter/unused-files': [
                    {
                        level: 'error',
                        config: {
                            entry: [/\/src\/bar\/index.js/],
                        },
                    },
                ],
            },
        }));
        const stricter = getStricter({
            config: stricterConfigPath,
            reporter: undefined,
            rulesToVerify: undefined,
            clearCache: undefined,
        });

        stricter();
        expect(console.log).toHaveBeenCalledTimes(3);
        expect(console.log).toHaveBeenNthCalledWith(
            1,
            expect.stringMatching(
                /.*error:.*stricter\/unused-files.*__fixtures__\/project\/src\/foo\/index.js/,
            ),
        );
        expect(console.log).toHaveBeenNthCalledWith(
            2,
            expect.stringMatching(
                /.*error:.*stricter\/unused-files.*__fixtures__\/project\/src\/index.js/,
            ),
        );
        expect(console.log).toHaveBeenNthCalledWith(3, '2 errors');
    });

    it('should work with rules config function', () => {
        jest.doMock(stricterConfigPath, () => ({
            root: 'project/src',
            rulesDir: 'project/rules',
            exclude: [/.*\.json/],
            rules: ({ packages }: { packages: string[] }) => ({
                'stricter/unused-files': packages.map((pkg: string) => ({
                    level: 'error',
                    config: {
                        entry: [new RegExp(`${pkg}/index.js`)],
                    },
                })),
            }),
        }));
        const stricter = getStricter({
            config: stricterConfigPath,
            reporter: undefined,
            rulesToVerify: undefined,
            clearCache: undefined,
        });

        stricter();
        expect(console.log).toHaveBeenCalledTimes(5);
        expect(console.log).toHaveBeenNthCalledWith(
            1,
            expect.stringMatching(
                /.*error:.*stricter\/unused-files.*__fixtures__\/project\/src\/foo\/index.js/,
            ),
        );
        expect(console.log).toHaveBeenNthCalledWith(
            2,
            expect.stringMatching(
                /.*error:.*stricter\/unused-files.*__fixtures__\/project\/src\/index.js/,
            ),
        );
        expect(console.log).toHaveBeenNthCalledWith(
            3,
            expect.stringMatching(
                /.*error:.*stricter\/unused-files.*__fixtures__\/project\/src\/bar\/index.js/,
            ),
        );
        expect(console.log).toHaveBeenNthCalledWith(
            4,
            expect.stringMatching(
                /.*error:.*stricter\/unused-files.*__fixtures__\/project\/src\/index.js/,
            ),
        );
        expect(console.log).toHaveBeenNthCalledWith(5, '4 errors');
    });

    it('should work with rules config function and custom packages array', () => {
        jest.doMock(stricterConfigPath, () => ({
            root: 'project/src',
            rulesDir: 'project/rules',
            exclude: [/.*\.json/],
            rules: ({ packages }: { packages: string[] }) => ({
                'stricter/unused-files': packages.map((pkg: string) => ({
                    level: 'error',
                    config: {
                        entry: [new RegExp(`${pkg}/index.js`)],
                    },
                })),
            }),
            packages: ['f*'],
        }));
        const stricter = getStricter({
            config: stricterConfigPath,
            reporter: undefined,
            rulesToVerify: undefined,
            clearCache: undefined,
        });

        stricter();
        expect(console.log).toHaveBeenCalledTimes(3);
        expect(console.log).toHaveBeenNthCalledWith(
            1,
            expect.stringMatching(
                /.*error:.*stricter\/unused-files.*__fixtures__\/project\/src\/bar\/index.js/,
            ),
        );
        expect(console.log).toHaveBeenNthCalledWith(
            2,
            expect.stringMatching(
                /.*error:.*stricter\/unused-files.*__fixtures__\/project\/src\/index.js/,
            ),
        );
        expect(console.log).toHaveBeenNthCalledWith(3, '2 errors');
    });

    describe('plugins', () => {
        it('should add rule definitions available to be used in `rules`', () => {
            const ruleSpy = jest.fn(() => []);
            jest.doMock(
                'stricter-plugin-abc',
                () => ({
                    rules: {
                        'some-rule': {
                            onProject: ruleSpy,
                        },
                    },
                }),
                { virtual: true },
            );
            jest.doMock(stricterConfigPath, () => ({
                root: 'project/src',
                rulesDir: 'project/rules',
                rules: {
                    'abc/some-rule': [
                        {
                            level: 'error',
                        },
                    ],
                },
                plugins: ['abc'],
            }));
            const stricter = getStricter({
                config: stricterConfigPath,
                reporter: undefined,
                rulesToVerify: undefined,
                clearCache: undefined,
            });
            stricter();
            expect(console.log).toHaveBeenCalledTimes(1);
            expect(console.log).toHaveBeenCalledWith('No errors');
            expect(ruleSpy).toHaveBeenCalledTimes(1);
        });

        it('should not enable rules by default', () => {
            const ruleSpy = jest.fn(() => []);
            jest.doMock(
                'stricter-plugin-abc',
                () => ({
                    rules: {
                        'some-rule': {
                            onProject: ruleSpy,
                        },
                    },
                }),
                { virtual: true },
            );
            jest.doMock(stricterConfigPath, () => ({
                root: 'project/src',
                rulesDir: 'project/rules',
                rules: {},
                plugins: ['abc'],
            }));
            const stricter = getStricter({
                config: stricterConfigPath,
                reporter: undefined,
                rulesToVerify: undefined,
                clearCache: undefined,
            });
            stricter();
            expect(console.log).toHaveBeenCalledTimes(1);
            expect(console.log).toHaveBeenCalledWith('No errors');
            expect(ruleSpy).not.toHaveBeenCalled();
        });
    });
});
