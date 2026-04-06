// frontend/src/components/panels/SupabaseStoragePanel.tsx
import { ExternalLink } from '../ui/ExternalLink'

interface BucketPanel {
  name: string
  public: boolean
  fileSizeLimit: number | null
  allowedMimeTypes: string[] | null
}

interface ProjectStorage {
  name: string
  ref: string
  projectStatus: 'active' | 'inactive'
  buckets: BucketPanel[]
  bucketCount: number
}

interface SupabaseStoragePanelData {
  projects: ProjectStorage[]
  summary: {
    totalBuckets: number
    publicBuckets: number
    privateBuckets: number
    activeProjectCount: number
  }
}

function formatFileSize(bytes: number | null): string | null {
  if (bytes == null) return null
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(0)} GB`
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(0)} MB`
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(0)} KB`
  return `${bytes} B`
}

function ProjectStorageRow({ project }: { project: ProjectStorage }) {
  if (project.projectStatus === 'inactive') {
    return (
      <div className="flex items-center justify-between py-2 px-3 border border-[#252535] rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#606070] shrink-0" />
          <span className="text-sm text-[#9090A0]">{project.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F59E0B15] text-[#F59E0B]">
            Paused
          </span>
        </div>
      </div>
    )
  }

  if (project.buckets.length === 0) {
    return (
      <div className="flex items-center justify-between py-2 px-3 border border-[#252535] rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#10B981] shrink-0" />
          <span className="text-sm text-[#E2E2E8]">{project.name}</span>
        </div>
        <span className="text-[10px] text-[#606070]">No buckets</span>
      </div>
    )
  }

  return (
    <div className="border border-[#252535] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#10B981] shrink-0" />
          <span className="text-sm font-medium text-[#E2E2E8]">{project.name}</span>
        </div>
        <span className="text-xs text-[#606070]">
          {project.bucketCount} bucket{project.bucketCount !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="px-3 pb-2 space-y-1">
        {project.buckets.map((bucket) => (
          <div key={bucket.name} className="flex items-center justify-between text-xs py-1">
            <div className="flex items-center gap-2">
              <span className="text-[#E2E2E8]">{bucket.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  bucket.public ? 'bg-[#10B98115] text-[#10B981]' : 'bg-[#1E1E2E] text-[#606070]'
                }`}
              >
                {bucket.public ? 'Public' : 'Private'}
              </span>
            </div>
            {bucket.fileSizeLimit && (
              <span className="text-[10px] text-[#606070]">
                {formatFileSize(bucket.fileSizeLimit)} max
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function SupabaseStoragePanel({ data }: { data: SupabaseStoragePanelData }) {
  if (!data) return null

  const projects = data.projects ?? []
  const activeProjects = projects.filter((p) => p.projectStatus === 'active')
  const pausedProjects = projects.filter((p) => p.projectStatus === 'inactive')
  const sorted = [...activeProjects, ...pausedProjects]

  if (sorted.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <ExternalLink href="https://supabase.com/dashboard" className="text-xs text-[#606070]">
            View in Supabase
          </ExternalLink>
        </div>
        <p className="text-xs text-[#606070]">No projects found</p>
      </div>
    )
  }

  const summary = data.summary
  const allActive = pausedProjects.length === 0
  const hasBuckets = summary.totalBuckets > 0
  const statusLabel = !allActive ? 'Degraded' : hasBuckets ? 'Operational' : 'No Buckets'
  const statusColor = !allActive ? 'bg-[#F59E0B]' : hasBuckets ? 'bg-[#10B981]' : 'bg-[#606070]'
  const statusTextColor = !allActive
    ? 'text-[#F59E0B]'
    : hasBuckets
      ? 'text-[#10B981]'
      : 'text-[#606070]'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
          <span className={`text-sm font-bold ${statusTextColor}`}>{statusLabel}</span>
        </div>
        <ExternalLink href="https://supabase.com/dashboard" className="text-xs text-[#606070]">
          View in Supabase
        </ExternalLink>
      </div>

      {/* Summary — hidden if only 1 project */}
      {activeProjects.length > 1 && (
        <div className="flex items-center gap-4">
          <div>
            <p className="text-2xl font-bold text-[#E2E2E8]">{summary.totalBuckets}</p>
            <p className="text-xs text-[#606070]">Total buckets</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#606070]">
            <span className="text-[#10B981]">{summary.publicBuckets} public</span>
            <span>·</span>
            <span>{summary.privateBuckets} private</span>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {sorted.map((project) => (
          <ProjectStorageRow key={project.ref} project={project} />
        ))}
      </div>

      <div className="text-[10px] text-[#606070]">
        {projects.length} project{projects.length !== 1 ? 's' : ''} · {activeProjects.length} active
      </div>
    </div>
  )
}
