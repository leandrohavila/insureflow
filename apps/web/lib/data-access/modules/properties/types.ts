export type PropertyPurpose = "SALE" | "RENT" | "SALE_AND_RENT"
export type PropertyType =
  | "APARTMENT"
  | "HOUSE"
  | "LAND"
  | "COMMERCIAL"
  | "OTHER"
export type PropertyStatus =
  | "DRAFT"
  | "AVAILABLE"
  | "RESERVED"
  | "SOLD"
  | "RENTED"
  | "INACTIVE"

export type PropertyImage = {
  id: string
  url: string
  alt?: string | null
  sortOrder: number
  isCover: boolean
}

export type Property = {
  id: string
  tenantId: string
  businessUnitId: string
  slug: string
  title: string
  description?: string | null
  purpose: PropertyPurpose
  type: PropertyType
  status: PropertyStatus
  city: string
  neighborhood?: string | null
  address?: string | null
  state?: string | null
  postalCode?: string | null
  price: number
  areaM2?: number | null
  bedrooms?: number | null
  bathrooms?: number | null
  parkingSpots?: number | null
  featured: boolean
  featuredUntil?: string | null
  published: boolean
  publishedAt?: string | null
  createdAt: string
  updatedAt: string
  images?: PropertyImage[]
  coverImage?: { id: string; url: string; alt?: string | null } | null
}

export type PropertyListResponse = {
  data: Property[]
  total: number
  page: number
  limit: number
}

export type PropertyListFilters = {
  search?: string
  businessUnitId?: string
  purpose?: PropertyPurpose
  city?: string
  neighborhood?: string
  published?: boolean
  page?: number
  limit?: number
}

export type CreatePropertyInput = {
  businessUnitId: string
  title: string
  description?: string
  purpose: PropertyPurpose
  type?: PropertyType
  city: string
  neighborhood?: string
  address?: string
  state?: string
  postalCode?: string
  price: number
  areaM2?: number
  bedrooms?: number
  bathrooms?: number
  parkingSpots?: number
  featured?: boolean
}

export type UpdatePropertyInput = Partial<CreatePropertyInput>

export type PropertyLead = {
  id: string
  tenantId: string
  businessUnitId: string
  propertyId: string
  name: string
  email?: string | null
  phone?: string | null
  message?: string | null
  source: string
  createdAt: string
  property?: Pick<Property, "id" | "title" | "slug">
}

export type PropertyLeadListItem = PropertyLead & {
  propertyTitle: string
  propertySlug?: string
}

export type Person = {
  id: string
  tenantId: string
  name: string
  kind: "INDIVIDUAL" | "COMPANY"
  document?: string | null
  email?: string | null
  phone?: string | null
  createdAt: string
  updatedAt: string
}

export type RealEstateDashboardStats = {
  totalProperties: number
  publishedProperties: number
  featuredProperties: number
  leadsReceived: number
  scheduledVisits: number
}
