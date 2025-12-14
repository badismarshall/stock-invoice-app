"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface StockTabsProps {
  overviewContent: React.ReactNode;
  stockContent: React.ReactNode;
  movementsContent: React.ReactNode;
  alertsContent: React.ReactNode;
}

export function StockTabs({ overviewContent, stockContent, movementsContent, alertsContent }: StockTabsProps) {
  const [activeTab, setActiveTab] = React.useState("overview")

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
        <TabsTrigger value="stock">Stock Actuel</TabsTrigger>
        <TabsTrigger value="movements">Mouvements</TabsTrigger>
        <TabsTrigger value="alerts">Alertes</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="space-y-4">
        {overviewContent}
      </TabsContent>
      
      <TabsContent value="stock" className="space-y-4">
        {stockContent}
      </TabsContent>
      
      <TabsContent value="movements" className="space-y-4">
        {movementsContent}
      </TabsContent>
      
      <TabsContent value="alerts" className="space-y-4">
        {alertsContent}
      </TabsContent>
    </Tabs>
  )
}

