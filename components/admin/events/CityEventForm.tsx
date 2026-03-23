import EventForm from "@/components/business/events/EventForm";

interface CityEventFormProps {
    listings: any[];
    initialData?: any;
    isEditing?: boolean;
}

export default function CityEventForm({ listings, initialData, isEditing }: CityEventFormProps) {
    return <EventForm listings={listings} initialData={initialData} isEditing={isEditing} adminMode />;
}