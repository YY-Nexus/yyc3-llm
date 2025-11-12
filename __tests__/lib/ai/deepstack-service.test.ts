import { DeepStackService, deepStackService } from "../../../lib/ai/deepstack-service"
import { deepStackConfig } from "../../../lib/ai/deepstack-config"

describe("DeepStackService getters and default branches", () => {
  test("getInstance returns singleton", () => {
    const a = DeepStackService.getInstance()
    const b = DeepStackService.getInstance()
    expect(a).toBe(b)
  })

  test("getSupportedLanguages returns config languages", () => {
    expect(deepStackService.getSupportedLanguages()).toEqual(deepStackConfig.supportedLanguages)
  })

  test("getCapabilities returns config capabilities", () => {
    expect(deepStackService.getCapabilities()).toEqual(deepStackConfig.capabilities)
  })
})

describe("optimizeCode and explainCode defaults", () => {
  test("optimizeCode uses default optimizationType 'readability'", async () => {
    const spy = jest.spyOn(deepStackService, "generateCode").mockResolvedValue({ success: true }) as any
    await deepStackService.optimizeCode("console.log('x')", "JavaScript")
    expect(spy).toHaveBeenCalled()
    const promptArg = spy.mock.calls[0][0] as string
    const optionsArg = spy.mock.calls[0][1]
    expect(promptArg).toContain("可读性")
    expect(optionsArg).toMatchObject({ language: "JavaScript", temperature: 0.2 })
    spy.mockRestore()
  })

  test("explainCode passes default temperature 0.3", async () => {
    const spy = jest.spyOn(deepStackService, "generateCode").mockResolvedValue({ success: true }) as any
    await deepStackService.explainCode("print(1)", "Python")
    expect(spy).toHaveBeenCalled()
    const optionsArg = spy.mock.calls[0][1]
    expect(optionsArg).toMatchObject({ language: "Python", temperature: 0.3 })
    spy.mockRestore()
  })
})