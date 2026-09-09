import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProjects } from '../useProjects'
import { useProjectStore } from '@/store/projectStore'
import { Project } from '@/types/project'

describe('useProjects hook', () => {
  beforeEach(() => {
    const projects: Project[] = [
      {
        name: 'React App',
        type: 'react',
        path: '/path/react',
        createdAt: '',
        pinned: false,
        tags: ['client'],
      },
      {
        name: 'Angular App',
        type: 'angular',
        path: '/path/angular',
        createdAt: '',
        pinned: false,
        tags: ['personal'],
      },
      {
        name: 'Another React',
        type: 'react',
        path: '/path/react2',
        createdAt: '',
        pinned: false,
        tags: ['client', 'archived'],
      },
    ]
    useProjectStore.getState().setProjects(projects)
    useProjectStore.getState().setSearchQuery('')
  })

  it('should return all projects when search query is empty', () => {
    const { result } = renderHook(() => useProjects())
    expect(result.current.filteredProjects).toHaveLength(3)
  })

  it('should filter projects by name', () => {
    act(() => {
      useProjectStore.getState().setSearchQuery('Angular')
    })
    const { result } = renderHook(() => useProjects())
    expect(result.current.filteredProjects).toHaveLength(1)
    expect(result.current.filteredProjects[0].name).toBe('Angular App')
  })

  it('should filter projects by type', () => {
    act(() => {
      useProjectStore.getState().setSearchQuery('react')
    })
    const { result } = renderHook(() => useProjects())
    expect(result.current.filteredProjects).toHaveLength(2)
  })

  it('should be case insensitive', () => {
    act(() => {
      useProjectStore.getState().setSearchQuery('REACT')
    })
    const { result } = renderHook(() => useProjects())
    expect(result.current.filteredProjects).toHaveLength(2)
  })

  it('should return empty list if no match found', () => {
    act(() => {
      useProjectStore.getState().setSearchQuery('Vue')
    })
    const { result } = renderHook(() => useProjects())
    expect(result.current.filteredProjects).toHaveLength(0)
  })

  it('should filter projects by tag', () => {
    const { result } = renderHook(() => useProjects('client'))
    expect(result.current.filteredProjects.map((project) => project.name)).toEqual([
      'React App',
      'Another React',
    ])
  })
})
