import { useMemo } from 'react'
import { useProjectStore } from '@/store/projectStore'

/**
 * Custom hook to manage project business logic and filtering.
 *
 * Provides filtered projects based on the current search query,
 * along with state management actions from the project store.
 *
 * @returns {Object} An object containing projects, filteredProjects, and store actions.
 */
export const useProjects = (tagFilter = 'all') => {
  const { projects, searchQuery, selectedProject, setSelectedProject, setProjects, loadProjects } =
    useProjectStore()

  const filteredProjects = useMemo(() => {
    const searchLower = searchQuery.toLowerCase()
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(searchLower) ||
        project.type.toLowerCase().includes(searchLower) ||
        (project.tags || []).some((tag) => tag.toLowerCase().includes(searchLower))
    )
    .filter((project) => tagFilter === 'all' || (project.tags || []).includes(tagFilter))
  }, [projects, searchQuery, tagFilter])

  return {
    projects,
    filteredProjects,
    selectedProject,
    setSelectedProject,
    setProjects,
    loadProjects,
  }
}
