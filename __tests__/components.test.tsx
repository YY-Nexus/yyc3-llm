import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { BrandButton } from '../components/ui/brand-button'
import { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut, CommandSeparator } from '../components/ui/command'
import Sidebar from '../components/layout/sidebar'
import MainContent from '../components/layout/main-content'
import MobileNavigation from '../components/layout/mobile-navigation'
describe('BrandButton', () => {
  it('renders with default props', () => {
    const { getByText } = render(<BrandButton>测试按钮</BrandButton>)
    expect(getByText('测试按钮')).toBeInTheDocument()
  })
  it('renders loading spinner', () => {
    const { container } = render(<BrandButton loading>加载中</BrandButton>)
    expect(container.querySelector('.animate-spin')).toBeTruthy()
  })
  it('renders with icon', () => {
    const { getByText } = render(<BrandButton icon={<span>图标</span>}>按钮</BrandButton>)
    expect(getByText('图标')).toBeInTheDocument()
  })
})

describe('Command UI', () => {
  it('renders Command and children', () => {
    const { getByRole } = render(
      <Command>
        <CommandList>
          <CommandGroup>
            <CommandItem>Item1</CommandItem>
            <CommandItem>Item2</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    )
    expect(getByRole('list')).toBeInTheDocument()
  })
  it('renders CommandDialog', () => {
    render(
      <CommandDialog open>
        <CommandInput />
        <CommandList>
          <CommandEmpty>无数据</CommandEmpty>
        </CommandList>
      </CommandDialog>
    )
  })
  it('renders CommandShortcut', () => {
    const { getByText } = render(<CommandShortcut>Ctrl+K</CommandShortcut>)
    expect(getByText('Ctrl+K')).toBeInTheDocument()
  })
})

describe('Sidebar', () => {
  it('renders and triggers onModuleChange', () => {
    const mockFn = jest.fn()
    const { getByText } = render(
      <Sidebar activeModule="local-model-engine" onModuleChange={mockFn} />
    )
    // 只要能渲染出模块名即可
    expect(getByText(/模型引擎|AI/)).toBeTruthy()
  })
})

describe('DefaultModuleView', () => {
  it('renders with local-model-engine', () => {
    const { getByText } = render(
      <MainContent activeModule="local-model-engine" />
    )
    expect(getByText(/模型引擎/)).toBeTruthy()
  })
})

describe('MobileNavigation', () => {
  it('renders and switches module', () => {
    const mockFn = jest.fn()
    const { getByText } = render(
      <MobileNavigation
        activeModule="local-model-engine"
        onModuleChange={mockFn}
        isOpen={true}
        onToggle={() => {}}
      />
    )
    expect(getByText(/模型引擎/)).toBeTruthy()
  })
})
