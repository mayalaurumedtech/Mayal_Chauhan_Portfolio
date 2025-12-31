import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Star, Mail, MailOpen, StarOff } from "lucide-react";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status?: string;
  isStarred?: boolean;
  isRead?: boolean;
}

interface AdminMessagesProps {
  messages: ContactMessage[];
  showStarredOnly?: boolean;
  onDelete: (id: string) => void;
  onToggleStar: (id: string, isStarred: boolean) => void;
  onMarkRead: (id: string, isRead: boolean) => void;
}

export const AdminMessages = ({ 
  messages, 
  showStarredOnly = false,
  onDelete, 
  onToggleStar, 
  onMarkRead 
}: AdminMessagesProps) => {
  const filteredMessages = showStarredOnly 
    ? messages.filter(m => m.isStarred) 
    : messages;

  const readMessages = filteredMessages.filter(m => m.isRead);
  const unreadMessages = filteredMessages.filter(m => !m.isRead);

  const MessageCard = ({ message }: { message: ContactMessage }) => (
    <Card className={`p-4 transition-all ${!message.isRead ? 'border-l-4 border-l-primary bg-primary/5' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold truncate">{message.name}</h4>
            {!message.isRead && (
              <Badge variant="default" className="text-xs">New</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">{message.email}</p>
          {message.subject && (
            <p className="text-sm font-medium mt-2">{message.subject}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{message.message}</p>
        </div>
        
        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleStar(message.id, !message.isStarred)}
            className={message.isStarred ? "text-yellow-500 hover:text-yellow-600" : "text-muted-foreground"}
          >
            {message.isStarred ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMarkRead(message.id, !message.isRead)}
            className="text-muted-foreground"
          >
            {message.isRead ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(message.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );

  const EmptyState = ({ text }: { text: string }) => (
    <div className="text-center py-12 text-muted-foreground">
      <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p>{text}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">
          {showStarredOnly ? 'Starred Messages' : 'All Messages'}
        </h2>
        <p className="text-muted-foreground">
          {showStarredOnly 
            ? `${filteredMessages.length} starred message${filteredMessages.length !== 1 ? 's' : ''}`
            : `${messages.length} total message${messages.length !== 1 ? 's' : ''}`
          }
        </p>
      </div>

      {showStarredOnly ? (
        <div className="space-y-3">
          {filteredMessages.length === 0 ? (
            <Card className="p-6">
              <EmptyState text="No starred messages" />
            </Card>
          ) : (
            filteredMessages.map((message) => (
              <MessageCard key={message.id} message={message} />
            ))
          )}
        </div>
      ) : (
        <Tabs defaultValue="unread" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="unread" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Unread ({unreadMessages.length})
            </TabsTrigger>
            <TabsTrigger value="read" className="flex items-center gap-2">
              <MailOpen className="h-4 w-4" />
              Read ({readMessages.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="unread" className="space-y-3">
            {unreadMessages.length === 0 ? (
              <Card className="p-6">
                <EmptyState text="No unread messages" />
              </Card>
            ) : (
              unreadMessages.map((message) => (
                <MessageCard key={message.id} message={message} />
              ))
            )}
          </TabsContent>

          <TabsContent value="read" className="space-y-3">
            {readMessages.length === 0 ? (
              <Card className="p-6">
                <EmptyState text="No read messages" />
              </Card>
            ) : (
              readMessages.map((message) => (
                <MessageCard key={message.id} message={message} />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
