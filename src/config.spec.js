const path = require('path')

const virtualConfig = jest.fn().mockReturnValue({})
let config
let fs

beforeEach(() => {
  jest.clearAllMocks()

  // Reset the config/context/state singletons with jest.resetModules().
  // Unfortunately this seems to destroy mocks from the main scope
  // so we have to redefine them for each test; I tried using
  // `delete require.cache[require.resolve('./config')]`
  // but Jest overrides the NodeJS require-mechanism and
  // refuses to let you clear individual entries from the cache.
  jest.resetModules()
  jest.doMock('./utils/fs')
  fs = require('./utils/fs')

  // Emulate a config file
  const configPath = './config.virtual'
  fs.findUpwardsFile.mockResolvedValue(configPath)
  jest.doMock(configPath, virtualConfig, { virtual: true })

  config = jest.requireActual('./config')
})

describe('getSampleConfig()', () => {
  it('reads sample template relative to itself', async () => {
    await config.getSampleConfig()

    expect(fs.readFile).toHaveBeenCalledTimes(1)
    expect(fs.readFile.mock.calls[0][0]).toBe(
      path.join(__dirname, 'templates', 'config.js')
    )
  })

  it('returns the contents of the template as a string', async () => {
    const sampleTemplate = 'The bestest of templates.'
    fs.readFile.mockResolvedValueOnce(sampleTemplate)

    await expect(config.getSampleConfig()).resolves.toBe(sampleTemplate)
  })
})

describe('getConfig()', () => {
  it('finds config in current or parent directories', async () => {
    expect.assertions(1)
    await config.getConfig()
      // Dont care if we fail down the line for this test
      .catch(() => {})
      .finally(() => {
        // Trust and outsource to findUpwardsFile
        expect(fs.findUpwardsFile).toHaveBeenCalled()
      })
  })

  it('merges with default settings', async () => {
    const configFile = {
      bird: 'mockingbird',
    }
    virtualConfig.mockReturnValueOnce(configFile)

    const resolvedConfig = await config.getConfig()

    expect(resolvedConfig).toMatchObject(configFile)
    expect(resolvedConfig).toContainKeys([
      'migrationsDirectory',
      'context',
      'fetchState',
      'storeState',
      'beforeAll',
      'afterAll',
      'beforeEach',
      'afterEach',
    ])
  })

  it('caches resolved configuration in memory (singleton)', async () => {
    const firstConfig = await config.getConfig()
    const secondConfig = await config.getConfig()

    expect(secondConfig).toBe(firstConfig)
  })

  describe('config.migrationsDirectory', () => {
    it('converts to an absolute path', async () => {
      const configFile = {
        migrationsDirectory: './absolute/power',
      }
      virtualConfig.mockReturnValueOnce(configFile)

      const { migrationsDirectory } = await config.getConfig()

      expect(path.isAbsolute(migrationsDirectory)).toBeTrue()

      // This is actually not required to fulfil the test case,
      // but it serves as a way to ensure the tests arent leaking.
      expect(migrationsDirectory).toContain('absolute')
    })
  })

  describe('config.context()', () => {
    it('returns a singleton', async () => {
      const { context } = await config.getConfig()

      const { firstContext } = await context()
      const { secondContext } = await context()

      expect(secondContext).toBe(firstContext)
    })
  })

  describe('config.fetchState()', () => {
    it('defaults to file-based state storage', async () => {
      const { fetchState } = await config.getConfig()
      fs.readFile.mockResolvedValueOnce('{}')

      await fetchState()

      expect(fs.readFile).toHaveBeenCalled()
    })

    it('is customizable', async () => {
      const fakeState = { success: 'For once!' }
      const configFile = {
        fetchState: async () => fakeState,
      }
      virtualConfig.mockReturnValueOnce(configFile)
      const { fetchState } = await config.getConfig()

      await expect(fetchState()).resolves.toBe(fakeState)
    })

    it('returns a singleton', async () => {
      const { fetchState } = await config.getConfig()
      fs.readFile.mockResolvedValueOnce('{}')

      const { firstState } = await fetchState()
      const { secondState } = await fetchState()

      expect(secondState).toBe(firstState)
    })
  })

  describe('config.storeState()', () => {
    it.todo('test')
    it.todo('falls back to file-based state storage')
  })

  describe('config.beforeAll()', () => {
    it.todo('test')
  })

  describe('config.beforeEach()', () => {
    it.todo('test')
  })

  describe('config.afterEach()', () => {
    it.todo('test')
  })

  describe('config.afterAll()', () => {
    it.todo('test')
  })
})
