export const PROJECT_STATUS_FILTERS = ['全部', '未開工', '已開工', '暫停', '完工']

export function filterProjectsByStatus(projects, { statusFilter, showCompleted }) {
  return (projects || []).filter((project) => {
    if (statusFilter === '全部') {
      return showCompleted || project.status !== '完工'
    }
    return project.status === statusFilter
  })
}
