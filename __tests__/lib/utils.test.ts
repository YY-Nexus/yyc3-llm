import { cn, formatBytes, formatDuration, detectLanguage, formatNumber, formatRelativeTime, generateId, debounce, throttle, getFileExtension } from '../../lib/utils'

describe('lib/utils', () => {
  test('formatBytes formats sizes correctly', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(1024)).toBe('1 KB')
    expect(formatBytes(1024 * 1024)).toBe('1 MB')
  })

  test('formatBytes handles negative decimals by clamping to 0', () => {
    expect(formatBytes(1536, -2)).toBe('2 KB')
  })

  test('formatDuration formats ms to human readable time', () => {
    expect(formatDuration(500)).toBe('500ms')
    expect(formatDuration(1500)).toBe('1.5s')
    expect(formatDuration(65000)).toBe('1m 5.0s')
  })

  test('detectLanguage covers additional branches', () => {
    expect(detectLanguage('using System; namespace Demo { }')).toBe('csharp')
    expect(detectLanguage('```c#\nusing System;')).toBe('csharp')
    expect(detectLanguage('def hello\n  puts "hi"\nend')).toBe('python')
    expect(detectLanguage('```ruby\nputs "hi"')).toBe('ruby')
    expect(detectLanguage('type User = { id: number }')).toBe('typescript')
    expect(detectLanguage('def foo():\n    pass')).toBe('python')
  })

  test('formatNumber formats K/M suffix', () => {
    expect(formatNumber(100)).toBe('100')
    expect(formatNumber(1500)).toBe('1.5K')
    expect(formatNumber(2_000_000)).toBe('2.0M')
  })

  describe('formatRelativeTime with fixed system time', () => {
    const fixedNow = new Date('2024-01-01T00:00:00Z')
    beforeAll(() => {
      jest.useFakeTimers()
      jest.setSystemTime(fixedNow)
    })
    afterAll(() => {
      jest.useRealTimers()
    })

    test('relative time buckets', () => {
      expect(formatRelativeTime(new Date(fixedNow.getTime() - 30 * 1000))).toBe('刚刚')
      expect(formatRelativeTime(new Date(fixedNow.getTime() - 5 * 60 * 1000))).toBe('5分钟前')
      expect(formatRelativeTime(new Date(fixedNow.getTime() - 3 * 60 * 60 * 1000))).toBe('3小时前')
      expect(formatRelativeTime(new Date(fixedNow.getTime() - 10 * 24 * 60 * 60 * 1000))).toBe('10天前')
      expect(formatRelativeTime(new Date(fixedNow.getTime() - 5 * 30 * 24 * 60 * 60 * 1000))).toBe('5个月前')
      expect(formatRelativeTime(new Date(fixedNow.getTime() - 3 * 12 * 30 * 24 * 60 * 60 * 1000))).toBe('3年前')
    })
  })

  test('formatDuration edge boundaries', () => {
    expect(formatDuration(999)).toBe('999ms')
    expect(formatDuration(60000)).toBe('1m 0.0s')
  })

  test('generateId returns alphanumeric of default length', () => {
    const id = generateId()
    expect(id).toHaveLength(8)
    expect(/^[A-Za-z0-9]+$/.test(id)).toBe(true)
  })

  test('generateId supports custom length', () => {
    const id = generateId(12)
    expect(id).toHaveLength(12)
    expect(/^[A-Za-z0-9]+$/.test(id)).toBe(true)
  })

  test('debounce delays calls and coalesces rapid triggers', () => {
    jest.useFakeTimers()
    const fn = jest.fn()
    const debounced = debounce(fn, 100)

    debounced('a')
    debounced('b')
    // Not yet called
    jest.advanceTimersByTime(99)
    expect(fn).not.toHaveBeenCalled()
    // Now should be called once with last args
    jest.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('b')
    jest.useRealTimers()
  })

  test('throttle limits calls within time window', () => {
    jest.useFakeTimers()
    const fn = jest.fn()
    const throttled = throttle(fn, 1000)

    throttled('x')
    throttled('y')
    throttled('z')
    // Only first call should execute immediately
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('x')

    // Advance window and call again
    jest.advanceTimersByTime(1000)
    throttled('w')
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenCalledWith('w')
    jest.useRealTimers()
  })

  test('getFileExtension maps known languages and defaults to .txt', () => {
    expect(getFileExtension('typescript')).toBe('.ts')
    expect(getFileExtension('Python')).toBe('.py')
    expect(getFileExtension('unknown')).toBe('.txt')
  })

  test('getFileExtension covers markdown mapping', () => {
    expect(getFileExtension('markdown')).toBe('.md')
  })
})
test('cn merges class names and resolves tailwind conflicts', () => {
  expect(cn('p-2', 'm-1')).toBe('p-2 m-1')
  expect(cn('p-2', 'p-4')).toBe('p-4')
  expect(cn('text-base', false && 'hidden', null as any, undefined, 'text-lg')).toBe('text-lg')
})

test('detectLanguage handles java/go/rust/php/html/css/sql/default', () => {
  expect(detectLanguage('public class Hello { public static void main(String[] args) {} }')).toBe('java')
  expect(detectLanguage('```java\npublic class X {}')).toBe('java')

  expect(detectLanguage('package main\nfunc main() {}')).toBe('go')
  expect(detectLanguage('```go\npackage main')).toBe('go')

  expect(detectLanguage('fn main() { let mut x = 1; }')).toBe('rust')

  expect(detectLanguage('<?php echo "hi"; ?>')).toBe('php')

  expect(detectLanguage('<!doctype html><html><head></head><body></body></html>')).toBe('html')

  expect(detectLanguage('@media screen and (min-width: 640px) { .x { color: red; } }')).toBe('css')

  expect(detectLanguage('select * from users where id = 1')).toBe('sql')

  expect(detectLanguage('console.log("hello")')).toBe('javascript')
})
