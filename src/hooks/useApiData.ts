import { useQuery, type UseQueryResult } from "react-query"
import { api } from "../services/api"

export const useOverviewKPIs = (month: string): UseQueryResult => {
  return useQuery(["overview", month], () => api.getOverviewKPIs(month), {
    keepPreviousData: true,
  })
}

export const useDemographicsData = (month: string): UseQueryResult => {
  return useQuery(["demographics", month], () => api.getDemographicsData(month), {
    keepPreviousData: true,
  })
}

export const useLearningDevelopment = (month: string): UseQueryResult => {
  return useQuery(["learning-development", month], () => api.getLearningDevelopment(month), {
    keepPreviousData: true,
  })
}

export const useSickbayData = (month: string): UseQueryResult => {
  return useQuery(["sickbay", month], () => api.getSickbayData(month), {
    keepPreviousData: true,
  })
}

export const useAttritionData = (month: string): UseQueryResult => {
  return useQuery(["attrition", month], () => api.getAttritionData(month), {
    keepPreviousData: true,
  })
}

export const useVacancies = (month: string): UseQueryResult => {
  return useQuery(["vacancies", month], () => api.getVacancies(month), {
    keepPreviousData: true,
  })
}
